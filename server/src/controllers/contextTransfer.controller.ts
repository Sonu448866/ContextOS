import { Request, Response, NextFunction } from 'express';
import { ContextTransferService } from '../services/contextTransfer.service';

export const generateTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const transfer = await ContextTransferService.generateTransfer(
      {
        projectId,
        transferType: req.body.transferType,
        outgoingOwner: req.body.outgoingOwner,
        incomingOwner: req.body.incomingOwner,
        period: req.body.period,
        instructions: req.body.instructions,
        selectedSourceIds: req.body.selectedSourceIds,
        selectedTaskIds: req.body.selectedTaskIds
      },
      req.id
    );
    res.status(201).json({ data: transfer, requestId: req.id });
  } catch (error) {
    next(error);
  }
};

export const listProjectTransfers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transfers = await ContextTransferService.getProjectTransfers(req.params.projectId);
    res.status(200).json({ data: transfers, requestId: req.id });
  } catch (error) {
    next(error);
  }
};

export const getTransfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transfer = await ContextTransferService.getTransferById(req.params.transferId);
    res.status(200).json({ data: transfer, requestId: req.id });
  } catch (error) {
    next(error);
  }
};
